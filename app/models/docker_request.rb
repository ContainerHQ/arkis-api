require 'rest-client'

class DockerRequest < Struct.new(:request)
  # Should be in config
  DOCKER_HOST             = 'http://staging-runners.42grounds.io:2375'
  DOCKER_DEFAULT_REGISTRY = 'https://registry-1.docker.io'

  def get
    RestClient.get(url) { |response| response }
  end

  def post
    RestClient.post(url, content, headers) { |response| response }
  end

  def delete
    RestClient.delete(url) { |response| response }
  end

  def hijack?
    @hijack ||= request.env['rack.hijack?']
  end

  private

  def headers
    @headers ||= { content_type: :json, accept: :json }
  end

  def content
    @content ||= request.body.read
  end

  def url
    @url ||= "#{DOCKER_HOST}#{request.script_name}#{request.path_info}?#{request.query_string}"
  end
end
