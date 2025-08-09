module Areas
  module ParquesInfantis
    module Scripts
      class H3Visualisation
        def self.call(destination_path, parques_path, bgri2021_path)
          new(destination_path, parques_path, bgri2021_path).call
        end

        attr_accessor :destination_path, :parques_path, :bgri2021_path

        def initialize(destination_path, parques_path, bgri2021_path)
          @destination_path = destination_path
          @parques_path = parques_path
          @bgri2021_path = bgri2021_path
        end

        def call
          lisboa = DadosLisboa::Lisboa.new
          playgrounds = DadosLisboa::Playgrounds.new(parques_path)
          data = JSON.parse(File.read(bgri2021_path))

          h3_data = {}
          empty_features = []
          data["features"]
            .select { |feature| lisboa.contains?(feature) }
            .each do |raw_feature|
              feature = DadosLisboa::MyGeoJsonFeature.new(raw_feature)
              hexes = feature.hexes

              if hexes.empty?
                feature = DadosLisboa::MyGeoJsonFeature.new(raw_feature)
                playground_count = playgrounds.count_in_area(feature.geometry)
                nearest_playground_distance = playgrounds.closest_distance_from(feature.geometry)
                children_per_playground = playground_count.zero? ?
                  nil :
                  feature.children_under_14 / playground_count.to_f

                empty_features << {
                  type: "Feature",
                  properties: {
                    bgri_2021_id: feature.bgri_2021_id,
                    children_under_14: feature.children_under_14,
                    playground_count: playground_count,
                    children_per_playground: children_per_playground,
                    nearest_playground_distance: nearest_playground_distance,
                    adequacy: "none"
                  },
                  geometry: feature.geometry
                }
                next
              end

              hexes.each do |hex|
                h3_index = hex[:id]
                h3_data[h3_index] ||= {
                  bgri_2021_id: {},
                  freguesias: Set.new,
                  children_under_14: 0,
                  playground_count: playgrounds.count_in_area(hex[:geometry]),
                  nearest_playground_distance: playgrounds.closest_distance_from(hex[:geometry]),
                  coordinates: hex[:coordinates]
                }

                h3_data[h3_index][:bgri_2021_id][feature.bgri_2021_id] = hex[:weight].round(2)
                h3_data[h3_index][:children_under_14] += feature.children_under_14.to_f * hex[:weight]
                h3_data[h3_index][:children_per_playground] = h3_data[h3_index][:playground_count].zero? ?
                  nil :
                  h3_data[h3_index][:children_under_14] / h3_data[h3_index][:playground_count]
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
                  playground_count: data[:playground_count],
                  children_per_playground: data[:children_per_playground]&.round(2),
                  nearest_playground_distance: data[:nearest_playground_distance]&.round(2)
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
