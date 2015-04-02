class Docker::API::Root < Docker::API
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
