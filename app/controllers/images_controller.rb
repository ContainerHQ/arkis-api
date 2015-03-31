# map to /images
class ImagesController < DockerController
  reroute :post, %w(
    /create
  )

  reroute :delete, %w(
    /:id
  )
end
