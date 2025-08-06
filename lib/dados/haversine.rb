# frozen_string_literal: true
module Dados
  module Haversine
    R = 6371000.0 # metros

    module_function
    def distance_m(lat1, lon1, lat2, lon2)
      dlat = to_rad(lat2 - lat1)
      dlon = to_rad(lon2 - lon1)
      a = Math.sin(dlat/2)**2 + Math.cos(to_rad(lat1))*Math.cos(to_rad(lat2))*Math.sin(dlon/2)**2
      c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      R * c
    end

    def to_rad(deg)
      deg * Math::PI / 180.0
    end
  end
end
