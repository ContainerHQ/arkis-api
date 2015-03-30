# Inherit from this class when wrapping Docker API calls.
class DockerController < ApplicationController
  def self.reroute(method, routes)
    routes.each do |route|
      send(method, route) do
        DockerRequest.new(request).send
      end
    end
  end
end