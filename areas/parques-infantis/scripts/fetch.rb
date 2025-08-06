# frozen_string_literal: true
require 'fileutils'
require_relative '../../../lib/dados/paths'

seed = File.join('areas','parques-infantis','seed','parques.geojson')
dest_dir = File.join(Dados::Paths.src_dir('parques-infantis'))
FileUtils.mkdir_p(dest_dir)
FileUtils.cp(seed, File.join(dest_dir, 'parques.geojson'))
puts "Fetch: parques -> #{File.join(dest_dir,'parques.geojson')}"
