def tippecanoe_file(args)
  Rake::FileTask.define_task(args) do |task|
    cmd = [
      "tippecanoe",
      "-Z", "0", "-z", "12",
      "--no-feature-limit",
      "--no-tile-size-limit",
      "--simplification=1",
      "-o", task.name
    ] + task.sources

    stdout, stderr, status = Open3.capture3(*cmd)
    $stdout.print stdout
    $stderr.print stderr
  end
end
