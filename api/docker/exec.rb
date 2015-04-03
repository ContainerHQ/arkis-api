module Docker
  module API
    class Exec < Grape::API
      include Docker::Router

      prefix :exec

      reroute :get, %w(
    	  /:id/json
      )

      reroute :post, %w(
        /id/start
    	  /:id/resize
      )
    end
  end
end