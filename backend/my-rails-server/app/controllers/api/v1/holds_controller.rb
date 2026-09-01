module Api
    module V1
        class HoldsController < BaseController
            before_action :authenticate_user!
            before_action :set_hold, only: [:show, :destroy]

            # POST /api/v1/holds
            def create
                ticket_type_id = params[:ticket_type_id]
                quantity = params[:quantity].to_i

                result = Holds::CreateHold.new(
                    ticket_type_id: ticket_type_id,
                    quantity: quantity,
                    user: current_user
                ).call

                if result[:success]
                    render json: { hold: result[:hold].as_json_payload }, status: :created
                else
                    render json: { error: result[:error] }, status: :unprocessable_entity
                end
            end

            # GET /api/v1/holds/:id
            def show
                render json: { hold: @hold.as_json_payload }, status: :ok
            end

            # DELETE /api/v1/holds/:id  (release a hold early)
            def destroy
                ActiveRecord::Base.transaction do
                    ticket_type = TicketType.lock.find(@hold.ticket_type_id)
                    ticket_type.increment!(:quantity_remaining, @hold.quantity)
                    @hold.update!(status: "expired")
                end

                render json: { message: "Hold released. Inventory restored." }, status: :ok
            rescue StandardError => e
                render json: { error: "Could not release hold: #{e.message}" }, status: :unprocessable_entity
            end

            private

            def set_hold
                @hold = Hold.find_by(id: params[:id], status: "active")

                unless @hold
                    render json: { error: "Hold not found or already expired" }, status: :not_found
                    return
                end

                unless @hold.user_id == current_user.id
                    render json: { error: "Forbidden" }, status: :forbidden
                    return
                end
            end
        end
    end
end
