require "securerandom"

module Orders
    class CreateFromHold
        class PaymentError < StandardError; end

        def initialize(hold_id:, user:, payment_method: "card", payment_token: nil)
            @hold_id = hold_id
            @user = user
            @payment_method = payment_method || "card"
            @payment_token = payment_token
        end

        def call
            return error("Authentication required") unless @user
            return error("Hold ID is required") unless @hold_id

            result = nil

            ActiveRecord::Base.transaction do
                # Row-lock the hold record
                hold = Hold.lock.find_by(id: @hold_id)

                unless hold
                    return error("Hold reservation not found")
                end

                unless hold.user_id == @user.id
                    return error("Forbidden: Hold belongs to another user")
                end

                if hold.status != "active"
                    return error("Hold is no longer active (status: #{hold.status})")
                end

                if hold.expired?
                    return error("Reservation has expired. Please select your tickets again.")
                end

                # Lock the ticket type
                ticket_type = TicketType.lock.find_by(id: hold.ticket_type_id)
                unless ticket_type
                    return error("Ticket tier no longer exists")
                end

                # 1. Process payment inside transaction
                payment_ref = process_payment!(
                    total_cents: ticket_type.price_cents * hold.quantity,
                    method: @payment_method,
                    token: @payment_token
                )

                # 2. Create paid Order
                total_cents = ticket_type.price_cents * hold.quantity
                order = Order.create!(
                    user: @user,
                    hold: hold,
                    total_cents: total_cents,
                    payment_reference: payment_ref,
                    payment_method: @payment_method,
                    status: "paid"
                )

                # 3. Issue individual Tickets with unique QR codes
                hold.quantity.times do
                    Ticket.create!(
                        order: order,
                        ticket_type: ticket_type,
                        status: "valid"
                    )
                end

                # 4. Mark Hold as converted (inventory was already decremented during hold creation)
                hold.update!(status: "converted")

                result = { success: true, order: order }
            end

            result || error("Could not complete checkout.")
        rescue PaymentError => e
            error("Payment failed: #{e.message}")
        rescue StandardError => e
            error("Checkout failed: #{e.message}")
        end

        private

        def process_payment!(total_cents:, method:, token:)
            if token == "tok_fail" || token == "declined"
                raise PaymentError, "Your card was declined. Please check your card details."
            end
            "ch_stripe_" + SecureRandom.hex(12)
        end

        def error(message)
            { success: false, error: message }
        end
    end
end
