module Docker
  module API
    class Images < Grape::API
      include Docker::Router

      prefix :images

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
