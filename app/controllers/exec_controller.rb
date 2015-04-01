# map to /vX.XX/exec
class ExecController < DockerController
  reroute :get, %w(
	/:id/json
  )

  reroute :post, %w(
    /id/start
	/:id/resize
  )
end