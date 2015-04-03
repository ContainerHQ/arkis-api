module Docker
  module API
    class Root < Grape::API
    	include Docker::Router

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
