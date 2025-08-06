# frozen_string_literal: true
require 'json'
require 'fileutils'

module Dados
  module GeoJSON
    module_function

    def read(path)
      JSON.parse(File.read(path))
    end

    def write(path, obj)
      FileUtils.mkdir_p(File.dirname(path))
      File.write(path, JSON.pretty_generate(obj))
    end
  end
end
