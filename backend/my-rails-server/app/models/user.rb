class User < ApplicationRecord
    has_secure_password
    has_many :orders, dependent: :destroy

    ROLES = %w[customer admin venue_manager].freeze

    before_validation :downcase_email
    before_validation :ensure_admin_role_for_hardcoded_admin

    validates :email, presence: true,
                                        uniqueness: { case_sensitive: false },
                                        format: { with: URI::MailTo::EMAIL_REGEXP }
    validates :role, presence: true, inclusion: { in: ROLES }
    validates :password, length: { minimum: 6 }, if: -> { new_record? || !password.nil? }

    def full_name
        [first_name, last_name].compact_blank.join(" ")
    end

    def admin?
        role == "admin" || email.to_s.downcase.strip == "sebisomu@spotlight.com"
    end

    def as_json_payload
        {
            id: id,
            email: email,
            first_name: first_name,
            last_name: last_name,
            full_name: full_name,
            role: role,
            is_admin: admin?,
            created_at: created_at
        }
    end

    private

    def downcase_email
        self.email = email.to_s.downcase.strip
    end

    def ensure_admin_role_for_hardcoded_admin
        self.role = "admin" if email.to_s.downcase.strip == "sebisomu@spotlight.com"
    end
end
