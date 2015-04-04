require_relative 'base'

module Docker
  module API
    class Exec < Docker::API::Base

      reroute :get, %w(
        /:id/json
      )

      reroute :post, %w(
        /:id/start
        /:id/resize
      )
    end
  end
end
