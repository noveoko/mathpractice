from manimlib import *

class Addition(Scene):
    def construct(self):
        # Display the two numbers separately
        number1 = Integer(3)
        number2 = Integer(5)
        self.play(Write(number1), Write(number2))
        self.wait()

        # Show the addition operation between them
        result = Integer(8)
        self.play(Transform(number1, result))
        self.wait()

        # Finally, show the result of the addition
        self.play(Indicate(result))
        self.wait()
