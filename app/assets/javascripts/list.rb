class List < ApplicationRecord
	 has_many :card

	 default_scope { order("id") }
end
