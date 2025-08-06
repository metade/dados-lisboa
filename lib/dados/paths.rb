# frozen_string_literal: true
module Dados
  module Paths
    module_function
    def src_dir(area=nil)
      area ? File.join('data', 'src', area) : File.join('data', 'src')
    end
    def processed_dir
      File.join('site','assets','data','processed')
    end
  end
end
