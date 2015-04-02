require 'spec_helper'

describe 'Create a container' do
  include Rack::Test::Methods

  OUTER_APP = Rack::Builder.parse_file('config.ru').first

  def app
    OUTER_APP
  end

  it 'creates a container' do
    binding.pry
  end
end