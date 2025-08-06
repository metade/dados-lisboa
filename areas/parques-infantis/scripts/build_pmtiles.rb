# frozen_string_literal: true
require 'open3'
require 'fileutils'
require_relative '../../../lib/dados/paths'

def pmtiles_header?(path)
  File.binread(path, 7) == "PMTiles" rescue false
end

in_geojson  = File.join(Dados::Paths.src_dir('parques-infantis'), 'parques.geojson')
out_pmtiles = File.join(Dados::Paths.processed_dir, 'parques_infantis.pmtiles')
layer       = "parques_infantis"

FileUtils.mkdir_p(File.dirname(out_pmtiles))

cmd = ["tippecanoe", "-o", out_pmtiles, "-l", layer, "-zg", "--drop-densest-as-needed", "--include=dist_m", in_geojson]
puts "Executando: #{cmd.join(' ')}"
stdout, stderr, status = Open3.capture3(*cmd)
$stdout.print stdout; $stderr.print stderr
abort("tippecanoe falhou") unless status.success?

abort("Ficheiro resultante não é PMTiles") unless pmtiles_header?(out_pmtiles)
puts "OK: PMTiles -> #{out_pmtiles}"
