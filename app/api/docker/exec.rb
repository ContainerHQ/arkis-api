module API
  module Docker
    class Exec < API::Docker::Application
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