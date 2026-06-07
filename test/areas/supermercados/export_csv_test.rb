require "csv"
require "json"
require "tmpdir"
require_relative "../../test_helper"
require_relative "../../../areas/supermercados/scripts/export_csv"

class ExportCsvTest < Minitest::Test
  def test_exports_supermarket_properties_and_coordinates
    Dir.mktmpdir do |directory|
      input_path = File.join(directory, "supermercados.geojson")
      output_path = File.join(directory, "supermercados.csv")
      File.write(input_path, JSON.generate(geojson))

      Areas::Supermercados::Scripts::ExportCsv.call(input_path, output_path)

      rows = CSV.read(output_path, headers: true)
      assert_equal %w[brand name address longitude latitude], rows.headers
      assert_equal 1, rows.size
      assert_equal "Pingo Doce", rows[0]["brand"]
      assert_equal "Pingo Doce, Arroios", rows[0]["name"]
      assert_equal "Rua Teste, 1000-001", rows[0]["address"]
      assert_equal "-9.1355", rows[0]["longitude"]
      assert_equal "38.7369", rows[0]["latitude"]
    end
  end

  private

  def geojson
    {
      "type" => "FeatureCollection",
      "features" => [
        {
          "type" => "Feature",
          "geometry" => {
            "type" => "Point",
            "coordinates" => [-9.1355, 38.7369]
          },
          "properties" => {
            "brand" => "Pingo Doce",
            "name" => "Pingo Doce, Arroios",
            "address" => "Rua Teste, 1000-001"
          }
        }
      ]
    }
  end
end
