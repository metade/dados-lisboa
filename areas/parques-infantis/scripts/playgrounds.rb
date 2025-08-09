require "csv"
require "haversine"

module Areas
  module ParquesInfantis
    module Scripts
      class Playgrounds
        def self.call(destination_path, extra_quiosques_path, extra_playgrounds_path)
          new(destination_path, extra_quiosques_path, extra_playgrounds_path).call
        end

        attr_reader :destination_path, :extra_quiosques_path, :extra_playgrounds_path

        def initialize(destination_path, extra_quiosques_path, extra_playgrounds_path)
          @destination_path = destination_path
          @extra_quiosques_path = extra_quiosques_path
          @extra_playgrounds_path = extra_playgrounds_path
        end

        def call
          data = JSON.parse(File.read("data/src/parques_infantis.geojson"))
          data["features"].map! do |feature|
            feature["properties"] = {
              morada: feature["properties"]["MORADA"],
              designacao: feature["properties"]["DESIGNACAO"],
              gestao: feature["properties"]["GESTAO"],
              servico_cml: feature["properties"]["SERVICO_CML"]
            }
            feature
          end
          data["features"] += extra_playgrounds

          data["features"].each do |feature|
            lng, lat = feature["geometry"]["coordinates"]

            feature["properties"]["distance_from_quiosque"] = quiosques.closest_quiosque_distance(lat, lng)
          end

          File.write(destination_path, JSON.pretty_generate(data))
        end

        private

        def quiosques
          @quiosques ||= begin
            extra_quiosques = CSV.parse(open(extra_quiosques_path).read, headers: true)
              .map { |row| [row["Latitude"].to_f, row["Longitude"].to_f] }

            DadosLisboa::Quiosques.new(extra_quiosques)
          end
        end

        def extra_playgrounds
          extra_playgrounds = CSV.parse(open(extra_playgrounds_path).read, headers: true).map(&:to_h)
          extra_playgrounds.map do |row|
            {
              "type" => "Feature",
              "geometry" => {
                "type" => "Point",
                "coordinates" => [row["Longitude"].to_f, row["Latitude"].to_f]
              },
              "properties" => {
                "morada" => row["Morada"],
                "designacao" => row["Designação"],
                "gestao" => row["Gestão"],
                "servico_cml" => row["Serviço CML"]
              }
            }
          end
        end
      end
    end
  end
end
