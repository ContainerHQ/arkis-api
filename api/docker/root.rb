require_relative 'base'

module Docker
  module API
    class Root < Docker::API::Base

      reroute :get, %w(
        /_ping
        /events
        /info
        /version
      )

      reroute :post, %w(
        /auth
        /commit
        /build
        /version
      )
    end
  end
end
