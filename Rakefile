require "rake"
require "rake/clean"
require "fileutils"
require "listen"
require_relative "lib/dados_lisboa/rake_remote_file_task"
require_relative "lib/dados_lisboa/rake_tippecanoe_file_task"
require_relative "lib/dados_lisboa"

import "areas/census_2021/Rakefile"
import "areas/multibancos/Rakefile"
import "areas/pre-escolar/Rakefile"
import "areas/parques-infantis/Rakefile"

# MiniTest
require "rake/testtask"
Rake::TestTask.new(:test) do |t|
  t.libs << "test"
  t.test_files = FileList["test/**/*_test.rb"]
end

task default: ["data:all"]

namespace :data do
  desc "Construir todos os dados (todas as áreas)"
  task all: ["parques_infantis:all", "pre_escolar:all", "multibancos:all"]

  desc "Vigiar alterações em dados/scripts e reconstruir"
  task :watch do
    dirs = ["data/src", "areas/parques-infantis"]
    puts "A vigiar: #{dirs.join(", ")} (Ctrl+C para parar)"
    listener = Listen.to(*dirs) do |_m, _a, _r|
      puts "[dados] Alteração detetada. A reconstruir…"
      Rake::Task["data:all"].execute
      puts "[dados] Concluído."
    end
    listener.start
    sleep
  end
end

namespace :basemap do
  desc "Descarregar um basemap PMTiles para /site/assets/data/processed/basemap.pmtiles (defina BASEMAP_URL)"
  task :download do
    url = ENV["BASEMAP_URL"]
    abort("Defina BASEMAP_URL=<url> para descarregar o basemap.") unless url && !url.empty?
    require "open-uri"
    require "fileutils"
    path = File.join("site", "assets", "data", "processed", "basemap.pmtiles")
    FileUtils.mkdir_p(File.dirname(path))
    URI.open(url) do |io|
      File.open(path, "wb") { |f| IO.copy_stream(io, f) }
    end
    puts "Basemap descarregado para #{path}"
  end
end

namespace :verify do
  desc "Verificar cabeçalho PMTiles do tema parques-infantis"
  task :parques do
    path = File.join("site", "assets", "data", "processed", "parques_infantis.pmtiles")
    magic = begin
      File.binread(path, 7)
    rescue
      nil
    end
    abort("PMTiles ausente: #{path}") unless magic
    abort("Cabeçalho inválido (#{magic.inspect}) em #{path}") unless magic == "PMTiles"
    puts "OK: PMTiles válido em #{path}"
  end

  desc "Verificar basemap PMTiles (se existir)"
  task :basemap do
    path = File.join("site", "assets", "data", "processed", "basemap.pmtiles")
    if File.exist?(path)
      magic = begin
        File.binread(path, 7)
      rescue
        nil
      end
      abort("Basemap inválido (sem header) em #{path}") unless magic == "PMTiles"
      puts "OK: Basemap PMTiles válido em #{path}"
    else
      puts "Aviso: basemap.pmtiles não existe (será usado raster OSM)."
    end
  end
end

# Após data:all, correr verificações
task "data:all": ["verify:parques", "verify:basemap"]
