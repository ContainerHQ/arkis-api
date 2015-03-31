class ApplicationController < Sinatra::Base
  enable :sessions, :method_override

  helpers ApplicationHelpers

  configure :production, :development do
    enable :logging
  end
end
