require 'rest-client'

class DockerClient < Struct.new(:host, :cert_path, :tls_verify)
  alias_method :delete, :get
  alias_method :tls_verify?, :tls_verify

  def self.get
    # this should be changed with a non static thing
    # headers should add cert path if tls verify
    new('http://staging-runners.42grounds.io:2375', '', false)
  end

  def send_request(request, params:)
    docker_request = DockerRequest.new(self, request, params)

    send(docker_request.method, docker_request)
  end

  private

# send block as method (something like .get(url, &avoid_exceptions)
  def get(request)
    RestClient.get(request.url) { |response| response }
  end

  def put(request)
    RestClient.post(request.url, request.content, request.headers) { |response| response }
  end
end