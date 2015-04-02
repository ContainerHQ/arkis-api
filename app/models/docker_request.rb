class DockerRequest < Struct.new(:client, :request, :params)
  # headers must add ssl certficates if client.tls_verify?
  def headers
    { content_type: :json, accept: :json }
  end

  def method
    request.request_method.downcase
  end

  def content
    @content ||= request.body.read
  end

  def url
    @url ||= "#{client.host}#{request.script_name}#{request.path_info}?#{request.query_string}"
  end
end