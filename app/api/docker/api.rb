module Docker
  class API < Grape::API
    mount Docker::API::Containers
    mount Docker::API::Images
    mount Docker::API::Exec
    mount Docker::API::Root
  end
end