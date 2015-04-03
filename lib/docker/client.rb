module Docker
  class Client < Struct.new(:host, :cert_path, :tls_verify)
    alias_method :tls_verify?, :tls_verify

    def self.get
      # this should be changed with a non static thing
      # headers should add cert path if tls verify
      new('http://staging-runners.42grounds.io:2375', '', false)
    end

    def send_request(request, params:)
      docker_request = Docker::Request.new(self, request, params)
      docker_request.send
    end
  end
end