# frozen_string_literal: true
require 'test_helper'
require 'dados/haversine'

class HaversineTest < Minitest::Test
  def test_distance_zero
    d = Dados::Haversine.distance_m(0,0,0,0)
    assert_in_delta 0.0, d, 1e-6
  end
end
