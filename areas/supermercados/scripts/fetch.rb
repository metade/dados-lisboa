require "http"
require "json"

module Areas
  module Supermercados
    module Scripts
      module Fetch
        OVERPASS_URL = "https://overpass-api.de/api/interpreter"

        # Fetch supermarkets within Lisboa municipality (admin_level=7).
        # Query nwr (node/way/relation) and use `out center` so ways/relations
        # return a centroid coordinate rather than being silently dropped.
        # My Auchan stores are tagged shop=convenience in OSM, so we query
        # brand~auchan separately without a shop filter to catch all formats.
        QUERY = <<~OVERPASS
          [out:json][timeout:25];
          area["name"="Lisboa"]["boundary"="administrative"]["admin_level"="7"]->.searchArea;
          (
            nwr["shop"="supermarket"](area.searchArea);
            nwr["brand"~"[Aa]uchan"](area.searchArea);
          );
          out center;
        OVERPASS

        # Normalise the many OSM brand variants to a canonical display name
        BRAND_ALIASES = {
          /pingo doce/i        => "Pingo Doce",
          /continente/i        => "Continente",
          /auchan|my auchan/i  => "Auchan",
          /lidl/i              => "Lidl",
          /aldi/i              => "Aldi",
          /intermarch/i        => "Intermarché",
          /mercadona/i         => "Mercadona",
          /meu super/i         => "Meu Super",
          /amanhecer/i         => "Amanhecer",
          /celeiro/i           => "Celeiro",
          /spar/i              => "Spar",
        }

        def self.call(output_path)
          puts "Fetching supermarket data from Overpass API..."
          response = HTTP.timeout(60).post(OVERPASS_URL, form: {data: QUERY})

          unless response.status.success?
            raise "Overpass API error: #{response.status} — #{response.body.to_s[0, 200]}"
          end

          data = JSON.parse(response.body.to_s)
          features = data.fetch("elements", []).filter_map { |el| element_to_feature(el) }

          puts "  Found #{features.size} supermarkets"

          geojson = {"type" => "FeatureCollection", "features" => features}
          File.write(output_path, JSON.pretty_generate(geojson))
        end

        def self.element_to_feature(el)
          # nodes have lat/lon directly; ways/relations have a `center` hash from `out center`
          lat, lon = if el["lat"] && el["lon"]
            [el["lat"].to_f, el["lon"].to_f]
          elsif el["center"]
            [el["center"]["lat"].to_f, el["center"]["lon"].to_f]
          end
          return nil unless lat && lon

          tags = el.fetch("tags", {})
          raw_brand = tags["brand"] || tags["name"] || ""
          brand = normalise_brand(raw_brand)
          return nil if brand.nil?

          name = tags["name"] || raw_brand

          street = tags["addr:street"]
          postcode = tags["addr:postcode"]
          address_parts = [street, postcode].compact
          address = address_parts.empty? ? nil : address_parts.join(", ")

          {
            "type" => "Feature",
            "geometry" => {
              "type" => "Point",
              "coordinates" => [lon, lat]
            },
            "properties" => {
              "brand" => brand,
              "name" => name,
              "address" => address
            }
          }
        end
        private_class_method :element_to_feature

        def self.normalise_brand(raw)
          BRAND_ALIASES.each { |pattern, canonical| return canonical if raw.match?(pattern) }
          nil
        end
        private_class_method :normalise_brand
      end
    end
  end
end
