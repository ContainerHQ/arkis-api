class Docker::API::Images < Docker::API
  prefix: :images

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