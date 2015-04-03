require_relative 'containers'
require_relative 'images'
require_relative 'exec'
require_relative 'root'

module Docker
  module API
    class Base < Grape::API
      mount Docker::API::Containers
      mount Docker::API::Images
      mount Docker::API::Exec
      mount Docker::API::Root
    end
  end
end