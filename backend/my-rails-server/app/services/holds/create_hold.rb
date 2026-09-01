module Holds
    class CreateHold
        HOLD_DURATION_MINUTES = 10

        def initialize(ticket_type_id:, quantity:, user: nil)
            @ticket_type_id = ticket_type_id
            @quantity = quantity.to_i
            @user = user
        end

        def call
            return error("Quantity must be at least 1") if @quantity < 1
            return error("Maximum 8 tickets per hold") if @quantity > 8

            result = nil

            ActiveRecord::Base.transaction do
                # Row-lock the ticket type to prevent concurrent oversell
                ticket_type = TicketType.lock.find_by(id: @ticket_type_id)

                return error("Ticket tier not found") unless ticket_type
                return error("This tier is sold out") if ticket_type.quantity_remaining <= 0
                return error("Only #{ticket_type.quantity_remaining} tickets remaining") if ticket_type.quantity_remaining < @quantity

                expires_at = Time.current + HOLD_DURATION_MINUTES.minutes

                hold = Hold.new(
                    ticket_type: ticket_type,
                    user: @user,
                    quantity: @quantity,
                    status: "active",
                    expires_at: expires_at
                )

                unless hold.save
                    raise ActiveRecord::Rollback
                    return error(hold.errors.full_messages.join(", "))
                end

                ticket_type.decrement!(:quantity_remaining, @quantity)

                # Schedule expiry job
                ExpireHoldsJob.set(wait_until: expires_at).perform_later(hold.id)

                result = { success: true, hold: hold }
            end

            result || error("Could not create hold. Please try again.")
        rescue ActiveRecord::RecordNotFound => e
            error("Ticket tier not found")
        rescue StandardError => e
            error("An unexpected error occurred: #{e.message}")
        end

        private

        def error(message)
            { success: false, error: message }
        end
    end
end
