class DadosLisboa::H3Visualisation
  def self.call(destination_path, bgri2021_path, points_path, population_method)
    new(destination_path, bgri2021_path, points_path, population_method).call
  end

  attr_accessor :destination_path, :bgri2021_path, :points_path, :population_method

  def initialize(destination_path, bgri2021_path, points_path, population_method)
    @destination_path = destination_path
    @bgri2021_path = bgri2021_path
    @points_path = points_path
    @population_method = population_method
  end

  def call
    lisboa = DadosLisboa::Lisboa.new
    points = DadosLisboa::PointsOfInterest.new(points_path)
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
            population: 0,
            points: points.count_in_area(hex[:geometry]),
            nearest_point_distance: points.closest_distance_from(hex[:geometry]),
            coordinates: hex[:coordinates]
          }

          h3_data[h3_index][:bgri_2021_id][feature.bgri_2021_id] = hex[:weight].round(2)
          h3_data[h3_index][:population] += feature.send(population_method).to_f * hex[:weight]
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
            population: data[:population]&.round(2),
            points: data[:points],
            nearest_point_distance: data[:nearest_point_distance]&.round(2)
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
