module Areas
  module PreEscolar
    module Scripts
      class H3Visualisation
        def self.call(destination_path, escolas_path, bgri2021_path)
          new(destination_path, escolas_path, bgri2021_path).call
        end

        attr_accessor :destination_path, :escolas_path, :bgri2021_path

        def initialize(destination_path, escolas_path, bgri2021_path)
          @destination_path = destination_path
          @escolas_path = escolas_path
          @bgri2021_path = bgri2021_path
        end

        def call
          lisboa = DadosLisboa::Lisboa.new
          points = DadosLisboa::PointsOfInterest.new(escolas_path)
          data = JSON.parse(File.read(bgri2021_path))

          h3_data = {}
          empty_features = []
          data["features"]
            .select { |feature| lisboa.contains?(feature) }
            .each do |raw_feature|
              feature = DadosLisboa::MyGeoJsonFeature.new(raw_feature)
              hexes = feature.hexes

              raise if hexes.empty?

              hexes.each do |hex|
                h3_index = hex[:id]
                h3_data[h3_index] ||= {
                  bgri_2021_id: {},
                  freguesias: Set.new,
                  children_under_14: 0,
                  schools_count: points.count_in_area(hex[:geometry]),
                  nearest_school_distance: points.closest_distance_from(hex[:geometry]),
                  coordinates: hex[:coordinates]
                }

                h3_data[h3_index][:bgri_2021_id][feature.bgri_2021_id] = hex[:weight].round(2)
                h3_data[h3_index][:children_under_14] += feature.children_under_14.to_f * hex[:weight]
                h3_data[h3_index][:freguesias] << lisboa.freguesia_name(hex[:freguesia_code])
              end
            end

          geojson_data = {
            type: "FeatureCollection",
            features: empty_features + h3_data.map do |h3_index, data|
              {
                type: "Feature",
                properties: {
                  bgri_2021_id: data[:bgri_2021_id],
                  freguesias: data[:freguesias].sort.to_a,
                  children_under_14: data[:children_under_14]&.round(2),
                  school_count: data[:schools_count],
                  nearest_school_distance: data[:nearest_school_distance]&.round(2)
                },
                geometry: {
                  type: "MultiPolygon",
                  coordinates: [data[:coordinates]]
                }
              }
            end
          }

          File.write(destination_path, JSON.pretty_generate(geojson_data))
        end
      end
    end
  end
end
