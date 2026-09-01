module Api
    module V1
        module Auth
            class SessionsController < BaseController
                before_action :authenticate_user!, only: [:me]

                def create
                    user = User.find_by(email: params[:email].to_s.downcase.strip)

                    if user&.authenticate(params[:password])
                        token = JsonWebToken.encode(user_id: user.id)
                        render json: {
                            token: token,
                            user: user.as_json_payload
                        }, status: :ok
                    else
                        render json: { error: "Invalid email or password" }, status: :unauthorized
                    end
                end

                def me
                    render json: { user: current_user.as_json_payload }, status: :ok
                end
            end
        end
    end
end
