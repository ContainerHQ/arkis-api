class Docker::API::Exec < Docker::API
  prefix: :exec

  reroute :get, %w(
	  /:id/json
  )

  reroute :post, %w(
    /id/start
	  /:id/resize
  )
end