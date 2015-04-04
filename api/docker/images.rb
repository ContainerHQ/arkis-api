require_relative 'base'

module Docker
  module API
    class Images < Docker::API::Base

      reroute :get, %w(
        /json
        /viz
        /search
        /get
        /:id/get
        /:id/history
        /:id/json
      )

      reroute :post, %w(
        /create
        /load
        /:id/push
        /:id/tag
      )

      reroute :delete, %w(
        /:id
      )
    end
  end
end
