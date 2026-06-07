require "csv"
require "json"

module Areas
  module Supermercados
    module Scripts
      module ExportCsv
        HEADERS = %w[brand name address longitude latitude].freeze

        def self.call(input_path, output_path)
          geojson = JSON.parse(File.read(input_path))

          CSV.open(output_path, "wb", write_headers: true, headers: HEADERS) do |csv|
            geojson.fetch("features").each do |feature|
              properties = feature.fetch("properties")
              longitude, latitude = feature.dig("geometry", "coordinates")

              csv << [
                properties["brand"],
                properties["name"],
                properties["address"],
                longitude,
                latitude
              ]
            end
          end
        end
      end
    end
  end
end
