﻿using System.ComponentModel.DataAnnotations;

namespace SimpleCrm
{
    public class Customer
    {
        public int Id { get; set; }
        [MaxLength(50)]
        [Required()]
        public string FirstName { get; set; }
        [MinLength(1), MaxLength(50)]
        [Required()]
        public string LastName { get; set; }
        [MinLength(7), MaxLength(12), Phone]
        public string PhoneNumber { get; set; }
        [MaxLength(100), EmailAddress]
        [Required()]
        public string EmailAddress { get; set; }
        public bool OptInNewsletter { get; set; }
        public CustomerType Type { get; set; }
        public InteractionMethod PreferredContactMethod { get; set; }
        public CustomerStatus Status { get; set; }
        public DateTime LastContactDate { get; set; }
        [Required()]
        /// <summary>
        /// The last time this customer was updated. Optimistic concurrency control.
        /// </summary>
        public DateTime LastModified { get; set; } = DateTime.UtcNow;
    }
}