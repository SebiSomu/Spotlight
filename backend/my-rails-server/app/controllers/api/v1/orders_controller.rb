module Api
    module V1
        class OrdersController < BaseController
            before_action :authenticate_user!
            before_action :set_order, only: [:show]

            # GET /api/v1/orders
            def index
                orders = current_user.orders.order(created_at: :desc)
                render json: {
                    orders: orders.map(&:as_json_payload)
                }, status: :ok
            end

            # GET /api/v1/orders/:id
            def show
                render json: { order: @order.as_json_payload }, status: :ok
            end

            # POST /api/v1/orders
            def create
                hold_id = params[:hold_id]
                payment_method = params[:payment_method] || "card"
                payment_token = params[:payment_token]

                result = Orders::CreateFromHold.new(
                    hold_id: hold_id,
                    user: current_user,
                    payment_method: payment_method,
                    payment_token: payment_token
                ).call

                if result[:success]
                    render json: { order: result[:order].as_json_payload }, status: :created
                else
                    render json: { error: result[:error] }, status: :unprocessable_entity
                end
            end

            private

            def set_order
                @order = current_user.orders.find_by(id: params[:id])
                unless @order
                    render json: { error: "Order not found" }, status: :not_found
                end
            end
        end
    end
end
