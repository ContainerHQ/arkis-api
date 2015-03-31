# map to /vX.XX/
class IndexController < DockerController
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
