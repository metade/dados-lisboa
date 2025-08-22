class DadosLisboa::AirbnbListing
  attr_reader :data

  def self.parse_al_license(string)
    return $1 if string =~ /(\d+)(\/| |_|-|\\|&)*al/i
    return $2 if string =~ /al(\/| |_|-|\\|&)*(\d+)/i
    return string if /\A\d+\z/.match?(string)
    string if /(\d+)\/20[12]\d/.match?(string)
  end

  def self.valid_licenses
    @valid_licenses ||= JSON.parse(File.read("tmp/alojamentos_locais/licensed_als.json"))
  end

  def initialize(data)
    @data = data
  end

  def name
    data["name"]
  end

  def license
    self.class.parse_al_license(data["license"])
  end

  def status
    self.class.valid_licenses.has_key?(license)
  end

  def irregularity
    nil
  end

  def coordinates
    [data["longitude"].to_f, data["latitude"].to_f]
  end
end
