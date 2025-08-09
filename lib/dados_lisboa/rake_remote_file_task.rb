# frozen_string_literal: true

# Add to Gemfile: gem 'http'
require "rake"
require "http"
require "fileutils"
require "time"

module DadosLisboa
  class RakeRemoteFileTask < Rake::FileTask
    attr_reader :url

    def initialize(task_name, app, url)
      super(task_name, app)
      @url = url
    end

    def needed?
      return true unless File.exist?(name)

      begin
        local_time = File.mtime(name)
        remote_time = get_remote_timestamp

        if remote_time
          puts "Local: #{local_time}, Remote: #{remote_time}" if Rake.application.options.trace
          remote_time > local_time || @application.options.build_all
        else
          false
        end
      rescue => e
        puts "Error checking timestamp: #{e.message}" if Rake.application.options.trace
        false
      end
    end

    private

    def get_remote_timestamp
      response = HTTP.follow.timeout(30).head(@url)

      if response.status.success?
        last_modified = response.headers["Last-Modified"]
        last_modified ? Time.parse(last_modified) : nil
      else
        nil
      end
    rescue => e
      puts "Warning: Could not check remote timestamp: #{e.message}" if Rake.application.options.trace
      nil
    end
  end
end

def fetch_remote_url(url, file_path)
  task = DadosLisboa::RakeRemoteFileTask.new(file_path, Rake.application, url)

  task.enhance do |t|
    puts "Downloading #{url} to #{t.name}"
    FileUtils.mkdir_p(File.dirname(t.name))

    begin
      File.open(t.name, "wb") do |file|
        response = HTTP.follow.timeout(30).get(url)
        file.write(response.body)
      end
      puts "Successfully downloaded #{url} to #{t.name}"
    rescue => e
      File.delete(t.name) if File.exist?(t.name)
      raise "Error downloading #{url}: #{e.message}"
    end
  end

  Rake.application.instance_variable_get(:@tasks)[file_path] = task
  task
end
