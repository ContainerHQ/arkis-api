module Docker
  class Client < Struct.new(:host, :cert_path, :tls_verify)
    def self.get
      new(
        ENV.fetch('DOCKER_HOST', ''),
        ENV.fetch('DOCKER_CERT_PATH', ''),
        ENV.fetch('DOCKER_TLS_VERIFY', '')
      )
    end

    def tls_verify?
      !tls_verify.empty?
    end

    def endpoint
      host.gsub('tcp', tls_verify? ? 'https' : 'http')
    end

    def send(request, params:)
      Docker::Request.new(self, request, params).send
    end

    def stream(request, params:, &block)
      Docker::Request.new(self, request, params).stream(&block)
    end
  end
end
