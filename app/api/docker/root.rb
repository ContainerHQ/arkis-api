module API
  module Docker
		class Root < API::Docker::Application
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
