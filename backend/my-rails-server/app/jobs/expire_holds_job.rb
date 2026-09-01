class ExpireHoldsJob < ApplicationJob
    queue_as :default

    def perform(hold_id = nil)
        if hold_id
            expire_single_hold(hold_id)
        else
            expire_all_stale_holds
        end
    end

    private

    def expire_single_hold(hold_id)
        ActiveRecord::Base.transaction do
            hold = Hold.lock.find_by(id: hold_id, status: "active")
            return unless hold
            return unless hold.expired?

            ticket_type = TicketType.lock.find(hold.ticket_type_id)
            ticket_type.increment!(:quantity_remaining, hold.quantity)
            hold.update!(status: "expired")
        end
    rescue ActiveRecord::RecordNotFound
        # Hold or TicketType already deleted — nothing to do
    end

    def expire_all_stale_holds
        Hold.expired_pending.find_each do |hold|
            expire_single_hold(hold.id)
        end
    end
end
