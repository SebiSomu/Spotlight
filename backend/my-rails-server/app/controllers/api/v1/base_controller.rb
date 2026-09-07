module Api
    module V1
        class BaseController < ActionController::API
            def authenticate_user!
                render json: { error: "Unauthorized" }, status: :unauthorized unless current_user
            end

            def authenticate_admin!
                authenticate_user!
                return if performed?

                unless current_user&.admin?
                    render json: { error: "Forbidden: Admin access required" }, status: :forbidden
                end
            end

            def current_user
                @current_user ||= find_current_user
            end

            private

            def find_current_user
                header = request.headers["Authorization"]
                return nil unless header.present?

                token = header.split(" ").last
                decoded = JsonWebToken.decode(token)
                return nil unless decoded

                User.find_by(id: decoded[:user_id])
            end
        end
    end
end
