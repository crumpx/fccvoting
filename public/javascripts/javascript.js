$( document ).ready(function(){
	var optionCount = $('.form-choice');
	var fieldHtml = '<div class="new-poll-choice-item"><input class="short" type="text" name="options" placeholder="option"><span class="removeButton"></span></div>';
	var inputCounts = 1;

	$('.addButton').on('click',function(){
		$('.form-choice').append(fieldHtml);
		optionCount++;
	});

	$(optionCount).on('click', '.removeButton', function(e){ 
		e.preventDefault();
		$(this).closest('div').remove();
		optionCount--; 
	});

	var password = document.getElementById("newPassword");
	var confirm_password = document.getElementById("newPasswordConfirm");

	function validatePassword(){
	  if(password.value != confirm_password.value) {
	    confirm_password.setCustomValidity("Passwords Don't Match");
	  } else {
	    confirm_password.setCustomValidity('');
	  }
	}

	password.onchange = validatePassword;
	confirm_password.onkeyup = validatePassword;
});